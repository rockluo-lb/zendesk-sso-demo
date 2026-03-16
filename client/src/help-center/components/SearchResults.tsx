import { Button, Card, Empty, Flex, List, Typography } from 'antd';
import type { Article } from '../types';

const { Text, Paragraph } = Typography;

type SearchResultsProps = {
  results: Article[];
  query: string;
};

function SearchResults({ results, query }: SearchResultsProps) {
  return (
    <List
      dataSource={results}
      locale={{ emptyText: <Empty description={`No results for "${query}"`} /> }}
      header={<Text type="secondary">{results.length} result(s)</Text>}
      renderItem={(art) => (
        <List.Item>
          <Card hoverable style={{ width: '100%' }} size="small">
            <Flex justify="space-between" align="center">
              <Text strong>{art.title}</Text>
              <Button type="link" href={art.html_url} target="_blank" size="small">Open in Zendesk</Button>
            </Flex>
            {art.body && (
              <Paragraph type="secondary" style={{ margin: '4px 0 0' }} ellipsis={{ rows: 2 }}>
                <span dangerouslySetInnerHTML={{ __html: art.body.replace(/<[^>]*>/g, '').slice(0, 200) }} />
              </Paragraph>
            )}
          </Card>
        </List.Item>
      )}
    />
  );
}

export { SearchResults };
